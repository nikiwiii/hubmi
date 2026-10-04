from fastapi import APIRouter, Depends

from middleman.schemas import AdaptRequest, RefineRequest, ServiceCardResponse
from middleman.service import ChatLLM, adapt_innovation, get_innovation_or_404, get_llm, refine_card

router = APIRouter(prefix="/api/middleman", tags=["Middleman Innowacji (Asystent AI)"])


def _response(innovation: dict, card) -> ServiceCardResponse:
    return ServiceCardResponse(
        innovation_id=str(innovation.get("id")),
        innovation_title=innovation.get("title") or "Innowacja społeczna",
        innovation_url=innovation.get("url"),
        innovation_video_url=innovation.get("video_url"),
        card=card,
    )


@router.post("/adapt", response_model=ServiceCardResponse, summary="Dostosuj innowację do formy usługi dla instytucji")
async def adapt(request: AdaptRequest, llm: ChatLLM = Depends(get_llm)):
    """
    Zamienia wybraną innowację społeczną z bazy ROPS Kraków w kartę usługi dopasowaną do profilu instytucji
    (samorząd, CUS, OPS, NGO): zakres, zasoby, harmonogram, szacunkowy budżet, finansowanie, KPI, ryzyka i następne kroki.
    """
    innovation = get_innovation_or_404(request.innovation_id)
    card = await adapt_innovation(llm, innovation, request.profile)
    return _response(innovation, card)


@router.post("/refine", response_model=ServiceCardResponse, summary="Popraw kartę usługi według prośby instytucji")
async def refine(request: RefineRequest, llm: ChatLLM = Depends(get_llm)):
    """Zwraca nową kartę usługi uwzględniającą prośbę (np. „mamy mniejszy budżet”)."""
    innovation = get_innovation_or_404(request.innovation_id)
    card = await refine_card(llm, innovation, request.profile, request.card, request.instruction)
    return _response(innovation, card)
