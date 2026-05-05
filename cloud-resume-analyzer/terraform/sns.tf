resource "aws_sns_topic" "report_notifications" {
  name = "cloud-ats-report-notifications"

  tags = local.common_tags
}