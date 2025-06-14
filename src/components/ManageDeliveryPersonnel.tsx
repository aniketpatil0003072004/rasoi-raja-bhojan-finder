
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserX, Search, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useMessStaff } from '@/hooks/useMessStaff';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { toast } from 'sonner';

const ManageDeliveryPersonnel = () => {
    const { staff, isLoading, error, messIds } = useMessStaff();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedUser, setSearchedUser] = useState<Profile | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;
        setIsSearching(true);
        setSearchedUser(null);
        
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone_number', searchTerm)
            .eq('role', 'delivery_personnel')
            .single();

        if (profileError) {
            toast.error("Search Failed", { description: "Could not find a delivery person with that phone number, or an error occurred." });
        } else {
            setSearchedUser(profileData);
        }
        setIsSearching(false);
    };

    const addStaffMutation = useMutation({
        mutationFn: async (deliveryPersonId: string) => {
            if (messIds.length === 0) throw new Error("You don't own any mess.");
            // For simplicity, we add the staff to the first mess of the owner.
            // A dropdown could be added later if an owner has multiple messes.
            const messId = messIds[0];

            const isAlreadyStaff = staff?.some(s => s.delivery_person_id === deliveryPersonId && s.mess_id === messId);
            if (isAlreadyStaff) {
                throw new Error("This person is already part of your staff for this mess.");
            }

            const { error } = await supabase
                .from('mess_delivery_personnel')
                .insert({ mess_id: messId, delivery_person_id: deliveryPersonId });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Staff member added successfully!");
            setSearchedUser(null);
            setSearchTerm('');
            queryClient.invalidateQueries({ queryKey: ['messStaff'] });
        },
        onError: (err: Error) => {
            toast.error("Failed to add staff", { description: err.message });
        },
    });

    const removeStaffMutation = useMutation({
        mutationFn: async ({ messId, deliveryPersonId }: { messId: string, deliveryPersonId: string }) => {
            const { error } = await supabase
                .from('mess_delivery_personnel')
                .delete()
                .eq('mess_id', messId)
                .eq('delivery_person_id', deliveryPersonId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Staff member removed.");
            queryClient.invalidateQueries({ queryKey: ['messStaff'] });
        },
        onError: (err: Error) => {
            toast.error("Failed to remove staff", { description: err.message });
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    Manage Delivery Staff
                </CardTitle>
                <CardDescription>Add or remove delivery personnel for your mess.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <Input
                        placeholder="Search by phone number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="tel"
                        disabled={isSearching}
                    />
                    <Button type="submit" disabled={isSearching || !searchTerm}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="sr-only">Search</span>
                    </Button>
                </form>

                {isSearching && <Skeleton className="h-16 w-full rounded-md" />}

                {searchedUser && (
                    <div className="border p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{searchedUser.full_name}</p>
                            <p className="text-sm text-muted-foreground">{searchedUser.phone_number}</p>
                        </div>
                        <Button onClick={() => addStaffMutation.mutate(searchedUser.id)} disabled={addStaffMutation.isPending}>
                            {addStaffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Staff"}
                        </Button>
                    </div>
                )}
                
                <h3 className="text-lg font-semibold mt-6 mb-4">Current Staff</h3>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : staff && staff.length > 0 ? (
                    <ul className="space-y-2">
                        {staff.map((member) => (
                            <li key={`${member.mess_id}-${member.delivery_person_id}`} className="border p-3 rounded-md flex justify-between items-center bg-muted/20">
                                <div>
                                    <p className="font-semibold">{member.profiles?.full_name || 'Name not available'}</p>
                                    <p className="text-sm text-muted-foreground">Mess: {member.messes?.name || 'N/A'}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeStaffMutation.mutate({ messId: member.mess_id, deliveryPersonId: member.delivery_person_id })}
                                    disabled={removeStaffMutation.isPending}
                                    aria-label="Remove staff member"
                                >
                                    <UserX className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">You have no delivery staff assigned to your mess(es).</p>
                )}
            </CardContent>
        </Card>
    );
};

export default ManageDeliveryPersonnel;
