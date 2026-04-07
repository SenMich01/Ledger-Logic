import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "We couldn't load this data. Please try again.", 
  retry 
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {retry && (
          <Button variant="outline" size="sm" onClick={retry} className="mt-4 block">
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
