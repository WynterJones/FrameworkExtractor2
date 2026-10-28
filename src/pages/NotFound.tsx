import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="font-display text-5xl font-bold">404</h1>
        <p className="text-muted-foreground">That page does not exist.</p>
        <Button asChild><Link to="/">Back home</Link></Button>
      </div>
    </div>
  );
}
