import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBurial } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getOwnerToken } from "@/lib/owner-token";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/new-draft")({
  component: NewDraft,
});

const schema = z.object({
  projectName: z.string().min(1, "Required"),
  oneLiner: z.string().min(1, "Required"),
  domain: z.enum(["web", "mobile", "ml", "game", "hardware", "other"]),
  techStack: z.string().min(1, "List at least one technology"),
  teamSize: z.enum(["solo", "2-3", "4+"]),
  stageDied: z.enum([
    "Idea only",
    "Prototype",
    "50% done",
    "Almost complete",
    "Launched but abandoned",
  ]),
  whyItDied: z.string().min(1, "Required"),
  timeSpentValue: z.coerce.number().min(0),
    timeSpentUnit: z.enum(["days", "weeks", "months"]),
  salvageable: z.string().optional(),
  projectLink: z.string().optional(),
  openForRevival: z.boolean(),
  isAnonymous: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function NewDraft() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectName: "",
      oneLiner: "",
      domain: "web",
      techStack: "",
      teamSize: "solo",
      stageDied: "Idea only",
      whyItDied: "",
      timeSpentValue: 1,
      timeSpentUnit: "weeks",
      salvageable: "",
      openForRevival: false,
      isAnonymous: false,
    },
  });

  const mutation = useMutation({
    mutationFn: createBurial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      navigate({ to: "/dashboard" });
    },
  });

  function onSubmit(values: FormValues) {
  mutation.mutate({
    projectName: values.projectName,
    oneLiner: values.oneLiner,
    domain: values.domain,
    techStack: values.techStack.split(",").map((t) => t.trim()).filter(Boolean),
    teamSize: values.teamSize,
    stageDied: values.stageDied,
    whyItDied: values.whyItDied,
    timeSpent: { value: values.timeSpentValue, unit: values.timeSpentUnit },
    salvageable: values.salvageable ?? "",
    projectLink: values.projectLink ?? "",
    openForRevival: values.openForRevival,
    isAnonymous: values.isAnonymous,
    ownerToken: getOwnerToken(),
  });
}

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="font-display text-2xl font-semibold">Bury a draft</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every unfinished project has a lesson. Share yours.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project name</FormLabel>
                <FormControl>
                  <Input placeholder="SprintSense" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="oneLiner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-liner</FormLabel>
                <FormControl>
                  <Input placeholder="What was it supposed to do?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["web", "mobile", "ml", "game", "hardware", "other"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["solo", "2-3", "4+"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="techStack"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tech stack (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="React, Node.js, MongoDB" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stageDied"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage it died at</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      "Idea only",
                      "Prototype",
                      "50% done",
                      "Almost complete",
                      "Launched but abandoned",
                    ].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whyItDied"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Why did it die?</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Scope creep, burnout, ran out of time…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="timeSpentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time spent</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeSpentUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["days", "weeks", "months"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="salvageable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What's salvageable? (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="The auth flow is reusable" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
                  />
                  <FormField
  control={form.control}
  name="projectLink"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Project link (optional)</FormLabel>
      <FormControl>
        <Input placeholder="https://github.com/you/project" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

          <FormField
            control={form.control}
            name="openForRevival"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Open for revival</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Submit anonymously</FormLabel>
              </FormItem>
            )}
          />

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Burying…" : "Bury this project"}
          </Button>
        </form>
      </Form>
    </div>
  );
}