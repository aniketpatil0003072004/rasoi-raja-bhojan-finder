
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Review, Profile } from '@/types';

type ReviewWithProfile = Review & {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
};

interface ReviewListProps {
  reviews: ReviewWithProfile[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (reviews.length === 0) {
    return <p className="text-muted-foreground">No reviews yet. Be the first to leave one!</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
               <img src={review.profiles?.avatar_url || '/placeholder.svg'} alt={review.profiles?.full_name || 'User'} className="h-10 w-10 rounded-full object-cover" />
               <div>
                  <CardTitle className="text-base">{review.profiles?.full_name || "Anonymous"}</CardTitle>
                  <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
               </div>
            </div>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </CardHeader>
          {review.comment && (
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-foreground">{review.comment}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ReviewList;
