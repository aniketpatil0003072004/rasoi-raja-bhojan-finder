import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserX, Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useMessStaff } from '@/hooks/useMessStaff';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { toast } from 'sonner';
import { useAvailableDeliveryPersonnel } from '@/hooks/useAvailableDeliveryPersonnel';

const ManageDeliveryPersonnel = () => {
    const { staff, isLoading: isLoadingStaff, error: staffError, messIds } = useMessStaff();
    const { data: availablePersonnel, isLoading: isLoadingAvailable, error: availableError } = useAvailableDeliveryPersonnel();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const addStaffMutation = useMutation({
        mutationFn: async (deliveryPersonId: string) => {
            if (messIds.length === 0) throw new Error("You don't own any mess.");
            const messId = messIds[0];

            const isAlreadyStaff = staff?.some(s => s.delivery_person_id === deliveryPersonId);
            if (isAlreadyStaff) {
                throw new Error("This person is already part of your staff.");
            }

            const { error } = await supabase
                .from('mess_delivery_personnel')
                .insert({ mess_id: messId, delivery_person_id: deliveryPersonId });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Staff member added successfully!");
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

    const personnelToAdd = useMemo(() => {
        if (!availablePersonnel || !staff) return [];
        const staffIds = new Set(staff.map(s => s.delivery_person_id));
        return availablePersonnel.filter(p => !staffIds.has(p.id));
    }, [availablePersonnel, staff]);

    const filteredPersonnel = useMemo(() => {
        if (!personnelToAdd) return [];
        return personnelToAdd.filter(p =>
            p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [personnelToAdd, searchTerm]);

    const isLoading = isLoadingStaff || isLoadingAvailable;
    const error = staffError || availableError;

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
                <h3 className="text-lg font-semibold mb-2">Available Delivery Personnel</h3>
                <Input
                    placeholder="Filter by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />
                {isLoadingAvailable ? (
                    <Skeleton className="h-20 w-full rounded-md" />
                ) : availableError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{availableError.message}</AlertDescription>
                    </Alert>
                ) : filteredPersonnel.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                        {filteredPersonnel.map(person => (
                            <div key={person.id} className="border p-3 rounded-md flex justify-between items-center bg-muted/20">
                                <div>
                                    <p className="font-semibold">{person.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{person.phone_number}</p>
                                </div>
                                <Button size="sm" onClick={() => addStaffMutation.mutate(person.id)} disabled={addStaffMutation.isPending}>
                                    {addStaffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                     <p className="text-sm text-muted-foreground text-center py-4">
                        {personnelToAdd.length > 0 && searchTerm ? 'No match found for your filter.' : 'No new delivery personnel available to add.'}
                    </p>
                )}
                
                <h3 className="text-lg font-semibold mt-6 mb-4">Current Staff</h3>
                {isLoadingStaff ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : staffError ? (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{staffError.message}</AlertDescription>
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
