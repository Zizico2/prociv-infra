mock_provider "google" {}
variables {
  project_id    = "prociv-test"
  environment   = "staging"
  adapter_image = "example.com/adapter@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  gateway_image = "example.com/gateway@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
}
run "bounded_services" {
  command = plan
  assert {
    condition     = google_cloud_run_v2_service.adapter.scaling[0].min_instance_count == 0 && google_cloud_run_v2_service.gateway.scaling[0].max_instance_count == 2
    error_message = "Keep scale-to-zero and bounded instances."
  }
  assert {
    condition     = google_cloud_run_v2_service.gateway.template[0].containers[0].ports[0].name == "h2c"
    error_message = "Native gRPC requires h2c inside Cloud Run."
  }
}
