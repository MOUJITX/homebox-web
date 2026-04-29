import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

const DropdownMenu = ({ ...props }: MenuPrimitive.Root.Props) => {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
};

const DropdownMenuTrigger = ({
  className,
  ...props
}: MenuPrimitive.Trigger.Props) => {
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn("outline-none", className)}
      {...props}
    />
  );
};

const DropdownMenuPortal = ({ ...props }: MenuPrimitive.Portal.Props) => {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
};

const DropdownMenuPositioner = ({
  className,
  ...props
}: MenuPrimitive.Positioner.Props) => {
  return (
    <MenuPrimitive.Positioner
      data-slot="dropdown-menu-positioner"
      className={cn("z-50", className)}
      {...props}
    />
  );
};

const DropdownMenuPopup = ({
  className,
  children,
  ...props
}: MenuPrimitive.Popup.Props) => {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPositioner sideOffset={4}>
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-popup"
          className={cn(
            "min-w-[var(--anchor-width)] overflow-hidden rounded-lg bg-popover p-1 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </DropdownMenuPositioner>
    </DropdownMenuPortal>
  );
};

const DropdownMenuItem = ({
  className,
  ...props
}: MenuPrimitive.Item.Props) => {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
};

const DropdownMenuSeparator = ({
  className,
  ...props
}: MenuPrimitive.Separator.Props) => {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
