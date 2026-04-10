import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import slide1 from "@/assets/onboarding/slide1.png";
import slide2 from "@/assets/onboarding/slide2.png";
import slide3 from "@/assets/onboarding/Slide3.png";
import slide4 from "@/assets/onboarding/Slide4.png";
import slide5 from "@/assets/onboarding/Slide5.png";
import { useTranslation } from "react-i18next";

export default function OnboardingModal() {
  const { t } = useTranslation();

  const slides = [
    {
      title: t("onboarding.slide1"),
      image: slide1,
    },
    {
      title: t("onboarding.slide2"),
      image: slide2,
    },
    {
      title: t("onboarding.slide3"),
      image: slide3,
    },
    {
      title: t("onboarding.slide4"),
      image: slide4,
    },
    {
      title: t("onboarding.slide5"),
      image: slide5,
    },
  ];
  const shouldShow = localStorage.getItem("hasSeenOnboarding") !== "true";
  const [isOpen, setIsOpen] = useState(shouldShow);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("onboarding.welcome")}</DialogTitle>
          <DialogDescription>
            {t("onboarding.quickTour")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Image */}
          <div className="flex justify-center">
            <img
              src={slides[currentSlide].image}
              alt={`Slide ${currentSlide + 1}`}
              className="max-w-full h-auto rounded-lg"
            />
          </div>

          {/* Slide Title */}
          <h3 className="text-center text-lg font-semibold">
            {slides[currentSlide].title}
          </h3>

          {/* Progress indicator */}
          <div className="flex justify-center gap-1">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentSlide ? "bg-primary w-8" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              {t("common.previous")}
            </Button>

            <Button variant="ghost" onClick={handleSkip}>
              {t("common.skip")}
            </Button>

            <Button onClick={handleNext}>
              {currentSlide === slides.length - 1 ? t("common.done") : t("common.next")}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
