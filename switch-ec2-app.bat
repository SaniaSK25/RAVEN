@echo off
setlocal

where aws.exe >nul 2>&1
if not errorlevel 1 goto :use_aws_exe

where python >nul 2>&1
if errorlevel 1 goto :cli_missing
python -m awscli --version >nul 2>&1
if errorlevel 1 goto :cli_missing
set "AWS_CLI=python -m awscli"
goto :start_session

:use_aws_exe
set "AWS_CLI=aws.exe"

:start_session
call %AWS_CLI% ssm start-session ^
    --target i-01d3a560a249d8994 ^
    --region us-east-1 ^
    --document-name AWS-StartInteractiveCommand ^
    --parameters "command=bash /home/ssm-user/RAVEN/switch-ec2-app.sh"

if errorlevel 1 (
    echo Failed to start the SSM session. Check AWS credentials, Session Manager access, and instance status.
    exit /b 1
)
exit /b 0

:cli_missing
echo AWS CLI was not found or could not run. Install/configure AWS CLI and Session Manager Plugin first.
exit /b 1
