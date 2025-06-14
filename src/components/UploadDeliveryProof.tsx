
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Camera } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from './ui/skeleton';

interface UploadDeliveryProofProps {
    deliveryId: string;
    photoType: keyof Pick<Tables<'deliveries'>, 'pickup_mess_photo_url' | 'pickup_food_photo_url' | 'delivery_house_photo_url' | 'delivery_food_photo_url'>;
    label: string;
    currentPhotoUrl: string | null | undefined;
    onUploadSuccess: () => void;
}

const UploadDeliveryProof = ({ deliveryId, photoType, label, currentPhotoUrl, onUploadSuccess }: UploadDeliveryProofProps) => {
    const [file, setFile] = React.useState<File | null>(null);
    const [preview, setPreview] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const { mutate: uploadPhoto, isPending } = useMutation({
        mutationFn: async (selectedFile: File) => {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${photoType}.${fileExt}`;
            const filePath = `${deliveryId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('delivery_proofs')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                throw new Error(`Storage upload failed: ${uploadError.message}`);
            }

            const { error: dbError } = await supabase
                .from('deliveries')
                .update({ [photoType]: filePath })
                .eq('id', deliveryId);
            
            if (dbError) {
                await supabase.storage.from('delivery_proofs').remove([filePath]);
                throw new Error(`Database update failed: ${dbError.message}`);
            }
        },
        onSuccess: () => {
            toast.success('Photo uploaded successfully!');
            onUploadSuccess();
            setFile(null);
        },
        onError: (error) => {
            toast.error('Upload failed.', { description: error.message });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file) {
            uploadPhoto(file);
        }
    };
    
    const [signedUrl, setSignedUrl] = React.useState<string | null>(null);
    const [isUrlLoading, setUrlLoading] = React.useState(false);
    
    React.useEffect(() => {
        if (currentPhotoUrl) {
            const getSignedUrl = async () => {
                setUrlLoading(true);
                const { data, error } = await supabase.storage
                    .from('delivery_proofs')
                    .createSignedUrl(currentPhotoUrl, 300); // 5 minutes validity
                
                if (data) {
                    setSignedUrl(data.signedUrl);
                } else {
                    console.error("Could not get signed URL", error);
                }
                setUrlLoading(false);
            };
            getSignedUrl();
        }
    }, [currentPhotoUrl]);

    return (
        <div className="space-y-2">
            <Label htmlFor={photoType}>{label}</Label>
            {currentPhotoUrl && (
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Current Photo:</p>
                    {isUrlLoading ? <Skeleton className="h-32 w-32 rounded-md" /> :
                     signedUrl ? <img src={signedUrl} alt={label} className="h-32 w-32 object-cover rounded-md" /> :
                     <p className="text-sm text-red-500">Could not load image.</p>}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-2">
                <Input id={photoType} type="file" accept="image/*" onChange={handleFileChange} disabled={isPending} />
                {preview && <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded-md" />}
                <Button type="submit" disabled={!file || isPending} className="w-full">
                    {isPending ? 'Uploading...' : <><Camera className="mr-2" />{currentPhotoUrl ? 'Replace Photo' : 'Upload Photo'}</>}
                </Button>
            </form>
        </div>
    );
};

export default UploadDeliveryProof;
