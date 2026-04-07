import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon = FolderOpen,
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed bg-muted/30">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
