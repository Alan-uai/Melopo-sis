"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b overflow-hidden", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-colors hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <motion.div
        animate={{ rotate: props["data-state" as keyof typeof props] === "open" ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </motion.div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const isOpen = props["data-state" as keyof typeof props] === "open";
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden"
      {...props}
    >
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="accordion-content"
            initial={{ height: 0, opacity: 0, rotateX: -15 }}
            animate={{
              height: "auto",
              opacity: 1,
              rotateX: 0,
              transition: {
                height: { type: "spring", stiffness: 300, damping: 25 },
                opacity: { duration: 0.2 },
                rotateX: { type: "spring", stiffness: 200, damping: 20 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              rotateX: -15,
              transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.15 },
                rotateX: { duration: 0.2 },
              },
            }}
            className="preserve-3d perspective-near"
            style={{ transformOrigin: "top center" }}
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: { delay: 0.08, type: "spring", stiffness: 200, damping: 25 },
              }}
              exit={{ y: -5, opacity: 0, transition: { duration: 0.1 } }}
            >
              <div className={cn("pb-4 pt-0", className)}>{children}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AccordionPrimitive.Content>
  );
})
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
