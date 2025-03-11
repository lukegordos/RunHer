
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyTabStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
}

const EmptyTabState = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyTabStateProps) => {
  return (
    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
      <Icon className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        {description}
      </p>
      <Button 
        className="mt-4 bg-runher hover:bg-runher-dark"
        onClick={onAction}
      >
        {actionText}
      </Button>
    </div>
  );
};

export default EmptyTabState;
