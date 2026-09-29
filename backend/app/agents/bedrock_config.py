import os

from langchain_aws import ChatBedrock
from langchain_core.callbacks import BaseCallbackHandler


def _load_dotenv() -> None:
    """Load backend/.env (KEY=VALUE lines) without overriding real env vars.

    No third-party dependency: skips blanks/#comments, strips optional quotes.
    Real environment always wins — .env only fills gaps.
    """
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        ".env",
    )
    if not os.path.isfile(env_path):
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key, val = key.strip(), val.strip().strip("\"'")
            if key and key not in os.environ:
                os.environ[key] = val


_load_dotenv()


def get_llm() -> ChatBedrock:
    """Build the shared Bedrock chat model from environment.

    Credentials are NEVER handled here: boto3 resolves them automatically
    from the default chain (IAM role / SSO profile / env keys).
    Only model selection (model_id) and routing (region) come from env.
    """
    model_id = os.environ.get("BEDROCK_MODEL_ID", "")
    region_name = os.environ.get("AWS_REGION", "")

    if not model_id:
        raise RuntimeError("BEDROCK_MODEL_ID env var is not set.")
    if not region_name:
        raise RuntimeError("AWS_REGION env var is not set.")

    return ChatBedrock(model_id=model_id, region_name=region_name)


class TokenCollector(BaseCallbackHandler):
    """Collects token usage from LLM runs.

    Bedrock reports usage on the response message (`usage_metadata` with
    input_tokens / output_tokens). Missing data is tolerated as zeros —
    collection must never break the actual call.
    """

    def __init__(self) -> None:
        self.calls: list[dict] = []

    def on_llm_end(self, response, **kwargs) -> None:
        input_tokens = 0
        output_tokens = 0
        for generations in response.generations:
            for generation in generations:
                usage = (
                    getattr(
                        getattr(generation, "message", None), "usage_metadata", None
                    )
                    or {}
                )
                input_tokens += usage.get("input_tokens", 0)
                output_tokens += usage.get("output_tokens", 0)
        self.calls.append(
            {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
            }
        )

    def totals(self) -> dict:
        return {
            "input_tokens": sum(c["input_tokens"] for c in self.calls),
            "output_tokens": sum(c["output_tokens"] for c in self.calls),
            "total_tokens": sum(c["total_tokens"] for c in self.calls),
        }
