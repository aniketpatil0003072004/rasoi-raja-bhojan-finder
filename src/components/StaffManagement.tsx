
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { useOwnerMesses } from '@/hooks/useOwnerMesses';
import { useAvailableDeliveryPersonnel } from '@/hooks/useAvailableDeliveryPersonnel';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, PlusCircle, Trash2, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import AddStaffDialog from './dialogs/AddStaffDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/types';

const StaffList = ({ messId }: { messId: string }) => {
    const { data: staff, isLoading, error } = useAvailableDeliveryPersonnel(messId);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const removeMutation = useMutation({
        mutationFn: async (staffId: string) => {
            const { error } = await supabase
                .from('profiles')
                .update({ mess_id: null })
                .eq('id', staffId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Staff member removed.");
            queryClient.invalidateQueries({ queryKey: ['availableDeliveryPersonnel', messId] });
        },
        onError: (err: any) => {
            toast.error("Failed to remove staff", { description: err.message });
        }
    });

    if (isLoading) return <Skeleton className="h-20 w-full" />;
    if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>;

    return (
        <div>
            {staff && staff.length > 0 ? (
                <ul className="space-y-2">
                    {staff.map((person: Profile) => (
                        <li key={person.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{person.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{person.phone_number}</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeMutation.mutate(person.id)}
                                disabled={removeMutation.isPending && removeMutation.variables === person.id}
                                aria-label="Remove staff"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No delivery staff assigned to this mess.</p>
            )}
            <Button className="w-full mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2" />
                Add New Staff
            </Button>
            <AddStaffDialog messId={messId} isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
        </div>
    );
}


const StaffManagement = () => {
    const { messes, isLoading, error } = useOwnerMesses();

    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Messes</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Add, view, and manage the delivery personnel for your messes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {messes && messes.length > 0 ? messes.map(mess => (
                    <div key={mess.id}>
                        <h3 className="font-semibold mb-2">{mess.name}</h3>
                        <StaffList messId={mess.id} />
                    </div>
                )) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Messes Found</AlertTitle>
                        <AlertDescription>You need to create a mess before you can manage staff.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default StaffManagement;
