import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function AddQCDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      supabase
        .from("batches")
        .select("id, batch_number, product_id, products(name)")
        .then(({ data }) => {
          if (data) setBatches(data);
        });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const selectedBatchId = formData.get("batch_id") as string;
    const selectedBatch = batches.find((b) => b.id === selectedBatchId);

    const { error } = await supabase.from("quality_control_records").insert({
      batch_id: selectedBatchId,
      product_id: selectedBatch?.product_id,
      test_type: formData.get("test_type") as string,
      result: formData.get("result") as string,
      notes: formData.get("notes") as string,
      inspector_id: user.id,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to add QC test");
      console.error(error);
    } else {
      toast.success("QC test added successfully");
      queryClient.invalidateQueries({ queryKey: ["quality-control"] });
      setOpen(false);
      e.currentTarget.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New QC Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Quality Control Test</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch_id">Batch *</Label>
            <Select name="batch_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batch_number} - {batch.products?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_type">Test Type *</Label>
              <Input id="test_type" name="test_type" placeholder="e.g., pH Test" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">Result *</Label>
              <Select name="result" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Add any additional notes..." />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Test"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
