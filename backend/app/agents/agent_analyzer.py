from langchain_aws import ChatBedrock
from langchain_core.prompts import ChatPromptTemplate
from app.models.models import RequirementAnalysis

def analyze_requirement(requirement_text: str) -> RequirementAnalysis:
    llm = ChatBedrock(
        model_id="",
        region_name=""
    )

    structured_llm = llm.with_structured_output(RequirementAnalysis)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert FDA Quality Assurance and CSV Validation Engineer. "
        "Analyze the provided software requirement and classify it according to GAMP 5 and GxP impact. "
        "Extract factual reasoning for severity, probability, and detectability."),
        ("human", "Analyze this requirement: {requirement}")
    ])

    agent_chain = prompt | structured_llm

    result = agent_chain.invoke({"requirement": requirement_text})
    return result