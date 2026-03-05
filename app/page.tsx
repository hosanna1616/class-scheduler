import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100/50 via-background to-purple-200/30 p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Smart School Scheduler</h1>
          <p className="text-xl text-muted-foreground">
            Real-time classroom and teacher scheduling system for schools
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Manage your school's timetable with intelligent scheduling and real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Automated timetable generation</li>
                  <li>Real-time occupancy tracking</li>
                  <li>Teacher schedule management</li>
                  <li>Conflict-free scheduling</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Get Started</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in to access the admin dashboard and start managing your school's schedule.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button asChild className="flex-1">
                <Link href="/login">Admin Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/teacher/login">Teacher Portal</Link>
              </Button>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/occupancy">View Occupancy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

