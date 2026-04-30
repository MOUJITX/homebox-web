import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipPortal({ ...props }: TooltipPrimitive.Portal.Props) {
  return <TooltipPrimitive.Portal data-slot="tooltip-portal" {...props} />;
}

function TooltipPositioner({
  className,
  ...props
}: TooltipPrimitive.Positioner.Props) {
  return (
    <TooltipPrimitive.Positioner
      data-slot="tooltip-positioner"
      className={cn("z-50", className)}
      {...props}
    />
  );
}

function TooltipPopup({ className, ...props }: TooltipPrimitive.Popup.Props) {
  return (
    <TooltipPortal>
      <TooltipPositioner sideOffset={6}>
        <TooltipPrimitive.Popup
          data-slot="tooltip-popup"
          className={cn(
            "rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
            className,
          )}
          {...props}
        />
      </TooltipPositioner>
    </TooltipPortal>
  );
}

export { Tooltip, TooltipTrigger, TooltipPopup };
