"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { motion, AnimatePresence } from "framer-motion"
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
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Bookmark ribbon */}
        <motion.svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: props["data-state" as keyof typeof props] === "open" ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="shrink-0 text-muted-foreground"
        >
          <motion.path
            d="M3 1v12l5-3 5 3V1H3z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={props["data-state" as keyof typeof props] === "open" ? {
              fill: "currentColor",
              fillOpacity: 0.15,
            } : {
              fill: "none",
              fillOpacity: 0,
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.svg>
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const isOpen = props["data-state" as keyof typeof props] === "open";

  // Fan-fold children
  const childrenArray = React.Children.toArray(children);

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
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { type: "spring", stiffness: 250, damping: 22, mass: 0.8 },
                opacity: { duration: 0.15 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.1 },
              },
            }}
            className="preserve-3d perspective-near"
            style={{ transformOrigin: "top center", transformStyle: "preserve-3d" } as any}
          >
            <div className={cn("pb-4 pt-0", className)}>
              {childrenArray.map((child, idx) => (
                <motion.div
                  key={idx}
                  initial={{ rotateX: -20, opacity: 0, y: -8 }}
                  animate={{
                    rotateX: 0,
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 0.04 + idx * 0.03,
                      type: "spring",
                      stiffness: 200,
                      damping: 22,
                    },
                  }}
                  exit={{ rotateX: -10, opacity: 0, y: -4, transition: { duration: 0.1 } }}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "top center" } as any}
                >
                  {child}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AccordionPrimitive.Content>
  );
})
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
