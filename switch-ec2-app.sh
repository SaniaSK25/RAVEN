#!/usr/bin/env bash
set -Eeuo pipefail

RADAR_DIR="/home/ssm-user/team_b_problem1"
RAVEN_DIR="/home/ssm-user/RAVEN"

start_stack() {
    local stop_dir="$1"
    local start_dir="$2"
    local app_name="$3"

    if [[ ! -f "$stop_dir/docker-compose.yml" ]]; then
        printf 'Compose file not found: %s/docker-compose.yml\n' "$stop_dir" >&2
        return 1
    fi
    if [[ ! -f "$start_dir/docker-compose.yml" ]]; then
        printf 'Compose file not found: %s/docker-compose.yml\n' "$start_dir" >&2
        return 1
    fi

    printf 'Stopping the other application...\n'
    (cd "$stop_dir" && docker-compose down)
    printf 'Building and starting %s...\n' "$app_name"
    (cd "$start_dir" && docker-compose up -d --build)
    printf '%s is running. The stopped stack volumes were preserved.\n' "$app_name"
}

while true; do
    printf '\nEC2 application switcher\n'
    printf '1) PS1 - RADAR\n'
    printf '2) PS2 - RAVEN\n'
    printf 'Q) Quit\n'
    read -r -p 'Select an application: ' selection

    case "$selection" in
        1)
            start_stack "$RAVEN_DIR" "$RADAR_DIR" "PS1 - RADAR"
            exit
            ;;
        2)
            start_stack "$RADAR_DIR" "$RAVEN_DIR" "PS2 - RAVEN"
            exit
            ;;
        [Qq])
            exit 0
            ;;
        *)
            printf 'Invalid selection. Choose 1, 2, or Q.\n' >&2
            ;;
    esac
done
