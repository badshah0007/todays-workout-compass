import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import { ExerciseAnimation, type AnimKey } from "@/components/ExerciseAnimation";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";

type Exercise = { name: string; sets?: string; anim?: AnimKey; cue?: string };

export function WorkoutCarousel({ exercises, label = "Today's exercises" }: { exercises: Exercise[]; label?: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <Carousel setApi={setApi} opts={{ loop: true }} className="mt-8" aria-label="Today's exercises">
      <CarouselContent>
        {exercises.map((exercise, index) => (
          <CarouselItem key={exercise.name} aria-label={`${index + 1} of ${exercises.length}: ${exercise.name}`} aria-hidden={current !== index}>
            <div className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-card sm:aspect-[4/3]">
              {exercise.anim ? (
                <ExerciseAnimation kind={exercise.anim} />
              ) : (
                <div className="flex h-full items-center justify-center text-primary">
                  <Dumbbell className="h-24 w-24" strokeWidth={1} aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="mt-5 min-h-36 sm:min-h-28">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-2xl font-bold uppercase sm:text-3xl">{exercise.name}</h2>
                {exercise.sets && <span className="shrink-0 font-mono text-lg text-primary">{exercise.sets}</span>}
              </div>
              {exercise.cue && <p className="mt-3 max-w-xl text-base text-muted-foreground">{exercise.cue}</p>}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-5">
        <CarouselPrevious className="static h-12 w-12 translate-y-0 rounded-lg" title="Previous exercise" aria-label="Previous exercise" />
        <p className="font-mono text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          <span className="text-primary">{String(current + 1).padStart(2, "0")}</span> / {String(exercises.length).padStart(2, "0")}
        </p>
        <CarouselNext className="static h-12 w-12 translate-y-0 rounded-lg" title="Next exercise" aria-label="Next exercise" variant="default" />
      </div>
    </Carousel>
  );
}