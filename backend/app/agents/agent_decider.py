from langchain_aws import ChatBedrock
from langchain_core.prompts import ChatPromptTemplate
from app.models.models import AssuranceDecision

def assign_assurance_level(requirement_text: str, risk_band: str) -> AssuranceDecision:
    llm = ChatBedrock(
        model_id="",
        region_name=""
    )

    structured_llm = llm.with_structured_output(AssuranceDecision)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an FDA CSA Compliance Expert. Your job is to assign a testing level based on risk. "
        "If the risk band is HIGH, you must assign 'scripted' and set generate_test to True. "
        "If the risk band is LOW or MEDIUM, rely on supplier leverage and assign 'unscripted' or 'exploratory'."),
        ("human", "Requirement: {requirement}\nCalculated Risk Band: {risk_band}")
    ])

    chain = prompt | structured_llm
    return chain.invoke({
        "requirement": requirement_text,
        "risk_band": risk_band
    })