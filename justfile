set positional-arguments
sources:
    rtk npm run sources
images:
    rtk npm run compose -- build
up:
    rtk npm run compose -- up -d
down:
    rtk npm run compose -- down
smoke *args:
    rtk npm run smoke -- "$@"
verify:
    rtk npm run check
    rtk proxy terraform fmt -recursive -check providers

terraform-check:
    #!/usr/bin/env bash
    set -euo pipefail
    for root in bootstrap app; do
        export TF_DATA_DIR="$PWD/.artifacts/terraform-check/$root"
        rtk proxy terraform -chdir="providers/cloud-run/$root" init -backend=false -input=false -lockfile=readonly
        rtk proxy terraform -chdir="providers/cloud-run/$root" validate
        rtk proxy terraform -chdir="providers/cloud-run/$root" test
    done
