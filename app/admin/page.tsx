"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Download, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/components/language-provider"

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setGenerating(true)
    setError("")

    try {
      const response = await fetch("/api/timetable/generate", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate timetable")
      }

      router.push("/admin/schedule")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = async (type: string, format: string) => {
    setExporting(true)
    try {
      const response = await fetch(`/api/export?type=${type}&format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting:", error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
        <p className="text-muted-foreground">
          {t("admin.manageSystem")}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("admin.overview")}</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t("admin.analytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("admin.quickActions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("admin.generate")}
                  </Button>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.exportData")}</CardTitle>
                <CardDescription>{t("admin.downloadSchedules")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleExport("schedule", "csv")}
                    disabled={exporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("admin.exportSchedule")} (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleExport("schedule", "xlsx")}
                    disabled={exporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("admin.exportSchedule")} (Excel)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.gettingStarted")}</CardTitle>
                <CardDescription>{t("admin.followSteps")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>{t("admin.addTeachers")}</li>
                  <li>{t("admin.addClassrooms")}</li>
                  <li>{t("admin.addGrades")}</li>
                  <li>{t("admin.addSubjects")}</li>
                  <li>{t("admin.assignSubjects")}</li>
                  <li>{t("admin.generateTimetable")}</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}






