import { useMemo } from "react";
import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import type { Course } from "@/types/learning.types";

interface ReviewsTabProps {
  course: Course;
}

export function ReviewsTab({ course }: ReviewsTabProps) {
  // Rating distribution computed from the fetched reviews — never invented.
  const ratingDistribution = useMemo(() => {
    const reviews = course.reviews ?? [];
    return [5, 4, 3, 2, 1].map((star) =>
      reviews.length === 0
        ? 0
        : Math.round(
            (reviews.filter((review) => Math.round(review.rating) === star).length /
              reviews.length) *
              100,
          ),
    );
  }, [course]);

  return (
    <TabsContent value="reviews" className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6">Student Feedback</h3>
        <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-primary mb-2">{course.rating}</div>
            <div className="flex justify-center md:justify-start gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${s <= Math.round(course.rating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Course Rating</p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating, i) => (
              <div key={rating} className="flex items-center gap-2">
                <Progress value={ratingDistribution[i]} className="h-2" />
                <div className="flex items-center w-24 gap-1 text-sm text-muted-foreground">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-3 w-3 ${starIndex < rating ? "fill-current" : "text-transparent"}`}
                      />
                    ))}
                  </div>
                  <span className="ml-auto">{ratingDistribution[i]}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-6">
          {course.reviews?.map((review) => (
            <div key={review.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user.avatar} />
                  <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{review.user.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? "fill-current" : "text-muted/30"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pl-14">{review.comment}</p>
              <Separator className="mt-4" />
            </div>
          ))}
        </div>
      </div>
    </TabsContent>
  );
}
