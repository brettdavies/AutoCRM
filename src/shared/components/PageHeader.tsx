import { Link } from "react-router-dom"
import { Button } from "@/components/ui"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  backLink?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center space-x-2">
        {backLink && (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            asChild
          >
            <Link to={backLink}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
} 