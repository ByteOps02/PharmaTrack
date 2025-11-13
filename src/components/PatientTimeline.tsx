import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Activity, Pill, FlaskConical, Calendar, Stethoscope } from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  date: string;
  type: "appointment" | "record" | "vital" | "medication" | "lab";
  title: string;
  description?: string;
  status?: string;
}

interface PatientTimelineProps {
  events: TimelineEvent[];
}

const getIcon = (type: string) => {
  switch (type) {
    case "appointment":
      return <Calendar className="h-4 w-4" />;
    case "record":
      return <FileText className="h-4 w-4" />;
    case "vital":
      return <Activity className="h-4 w-4" />;
    case "medication":
      return <Pill className="h-4 w-4" />;
    case "lab":
      return <FlaskConical className="h-4 w-4" />;
    default:
      return <Stethoscope className="h-4 w-4" />;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case "appointment":
      return "bg-blue-500";
    case "record":
      return "bg-green-500";
    case "vital":
      return "bg-purple-500";
    case "medication":
      return "bg-orange-500";
    case "lab":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export const PatientTimeline = ({ events }: PatientTimelineProps) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => (
        <div key={event.id} className="relative">
          {index !== sortedEvents.length - 1 && (
            <div className="absolute left-4 top-10 h-full w-0.5 bg-border" />
          )}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-2 ${getColor(event.type)} text-white`}>
                  {getIcon(event.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.date), "PPP 'at' p")}
                      </p>
                    </div>
                    {event.status && (
                      <Badge variant="outline">{event.status}</Badge>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
      {sortedEvents.length === 0 && (
        <p className="text-center text-muted-foreground">No timeline events found.</p>
      )}
    </div>
  );
};
