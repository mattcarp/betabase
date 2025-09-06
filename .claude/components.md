# Component Patterns

## Shadcn Dialog Component Example

From: https://ui.shadcn.com/docs/components/dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here.
          </DialogDescription>
        </DialogHeader>
        {/* Content here */}
      </DialogContent>
    </Dialog>
  );
}
```

## Button Variants

- default
- destructive
- outline
- secondary
- ghost
- link

## Sidebar Component Pattern

From: https://ui.shadcn.com/docs/components/sidebar

### Basic Collapsible Sidebar Structure

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader>
        {/* Header content - stays visible when collapsed */}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Group Name</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icon className="h-4 w-4" />
                  <span>Menu Item</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{/* Footer content */}</SidebarFooter>
    </Sidebar>
  );
}
```

### Sidebar Collapsible Modes

- `"offcanvas"` - Sidebar overlays content on mobile
- `"icon"` - Sidebar collapses to icon-only view
- `"none"` - Sidebar doesn't collapse

### Making Content Responsive to Collapse State

```tsx
// Hide text when collapsed
<span className={cn(
  "transition-all duration-200",
  state === "collapsed" && "sr-only"
)}>
  Text content
</span>

// Using group data attributes (alternative)
<div className="group-data-[state=collapsed]:hidden">
  Content to hide when collapsed
</div>

// Center items when collapsed
<Button className="group-data-[state=collapsed]/sidebar:justify-center">
  <Icon className="h-4 w-4 group-data-[state=expanded]/sidebar:mr-2" />
  <span>Text</span>
</Button>
```

### Important CSS Variables

Add to your CSS file (e.g., mac-design-system.css):

```css
:root {
  --sidebar-width: 16rem; /* 256px - expanded width */
  --sidebar-width-icon: 3rem; /* 48px - collapsed width */
  --sidebar-width-mobile: 18rem; /* 288px - mobile width */
}
```
