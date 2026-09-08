from langchain_aws import ChatBedrock
from langchain_core.prompts import ChatPromptTemplate
from app.models.models import TestScript

def generate_test_script(requirement_text: str) -> TestScript:
    llm = ChatBedrock(
        model_id="",
        region_name=""
    )

    structured_llm = llm.with_structured_output(TestScript)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert Pharmaceutical Software Validation (CSV) Engineer. "
        "Given a software requirement, write a detailed step-by-step test script "
        "that proves the requirement is met. Be highly specific in your actions and expected results."),
        ("human", "Write a test script for this requirement: {requirement}")
    ])

    chain = prompt | structured_llm
    return chain.invoke({"requirement": requirement_text})