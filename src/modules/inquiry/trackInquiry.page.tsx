import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { Button } from "@/lib/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import { Input } from "@/lib/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { Badge } from "@/lib/ui/badge";
import { toast } from "sonner";
import { InquiryService, type Inquiry } from "./inquiry-service";
import { Search, FileDown, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

const trackSchema = v.object({
  inquiryId: v.pipe(
    v.string(),
    v.minLength(1, "Inquiry ID is required"),
    v.regex(/^inquiry_/, "Invalid inquiry ID format")
  ),
});

type TrackFormData = v.InferOutput<typeof trackSchema>;

export default function TrackInquiryPage() {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [location] = useLocation();

  const form = useForm<TrackFormData>({
    resolver: valibotResolver(trackSchema),
    defaultValues: {
      inquiryId: "",
    },
  });

  // Auto-search if inquiry ID is in URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const inquiryId = params.get('id');

    if (inquiryId && /^inquiry_/.test(inquiryId)) {
      form.setValue('inquiryId', inquiryId);
      // Auto-submit the form
      onSubmit({ inquiryId });
    }
  }, [location]);

  const onSubmit = async (data: TrackFormData) => {
    setIsSearching(true);
    try {
      const result = await InquiryService.getInquiry(data.inquiryId);
      if (result) {
        setInquiry(result);
      } else {
        toast.error("Inquiry not found. Please check the ID and try again.");
        setInquiry(null);
      }
    } catch (error: any) {
      console.error("Error fetching inquiry:", error);
      toast.error(error.message || "Failed to fetch inquiry");
      setInquiry(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: Inquiry["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "in-progress":
        return "bg-blue-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const downloadAttachment = (attachment: {
    name: string;
    type: string;
    data: string;
  }) => {
    try {
      const link = document.createElement("a");
      link.href = `data:${attachment.type};base64,${attachment.data}`;
      link.download = attachment.name;
      link.click();
      toast.success(`Downloading ${attachment.name}`);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <Link href="/contact">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contact
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track Your Inquiry</CardTitle>
          <CardDescription>
            Enter your inquiry ID to check the status and view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="inquiryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inquiry ID</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          {...field}
                          placeholder="inquiry_1234567890_abc123"
                          className="flex-1"
                        />
                        <Button type="submit" disabled={isSearching}>
                          {isSearching ? (
                            "Searching..."
                          ) : (
                            <>
                              <Search className="mr-2 h-4 w-4" />
                              Search
                            </>
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {inquiry && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Inquiry Details</CardTitle>
                <CardDescription>ID: {inquiry._id}</CardDescription>
              </div>
              <Badge className={getStatusColor(inquiry.status)}>
                {inquiry.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p className="text-sm">{inquiry.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">{inquiry.email}</p>
              </div>
              {inquiry.company && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Company
                  </p>
                  <p className="text-sm">{inquiry.company}</p>
                </div>
              )}
              {inquiry.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-sm">{inquiry.phone}</p>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Message
              </p>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                {inquiry.message}
              </p>
            </div>

            {/* Attachments */}
            {inquiry.attachments && inquiry.attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Attachments ({inquiry.attachments.length})
                </p>
                <div className="space-y-2">
                  {inquiry.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "Unknown size"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => attachment.data && downloadAttachment({ name: attachment.name, type: attachment.type, data: attachment.data })}
                        disabled={!attachment.data}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response from team */}
            {inquiry.response && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Response from Our Team
                </p>
                <p className="text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-950 p-3 rounded-md border border-green-200 dark:border-green-800">
                  {inquiry.response}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium">Created</p>
                  <p>{formatDate(inquiry.createdAt)}</p>
                </div>
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p>{formatDate(inquiry.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an inquiry ID?{" "}
            <Link href="/contact">
              <span className="text-primary hover:underline cursor-pointer">
                Submit a new inquiry
              </span>
            </Link>{" "}
            and you'll receive an ID via email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
