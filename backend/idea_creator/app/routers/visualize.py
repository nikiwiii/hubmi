from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.rate_limit import RateLimiter
from app.schemas import GenerateImageRequest, GenerateImageResponse, LLMImagePromptOutput
from app.services.images import ImageGenerationError, ImageGenerator, get_image_generator, to_data_url
from app.services.llm import ChatLLM, generate_json, get_llm, to_prompt_json
from app.services.prompts import IMAGE_PROMPT_SYSTEM_PROMPT, IMAGE_PROMPT_USER_TEMPLATE

image_rate_limiter = RateLimiter(max_requests=get_settings().image_rate_limit_per_minute)

router = APIRouter(tags=["Visualization"])


@router.post(
    "/generate_image",
    response_model=GenerateImageResponse,
    summary="Wizualizacja pomysłu: Groq pisze prompt, Pollinations generuje obraz",
    dependencies=[Depends(image_rate_limiter)],
)
async def generate_image(
    request: GenerateImageRequest,
    llm: ChatLLM = Depends(get_llm),
    images: ImageGenerator = Depends(get_image_generator),
):
    """Stateless: the image is returned as a data URL and is not stored."""
    idea = request.model_dump(mode="json", include={"tytul", "opis", "innowacyjnosc", "odbiorcy", "etap"})
    idea["kategoria"] = request.category or ""

    result = await generate_json(
        llm,
        IMAGE_PROMPT_SYSTEM_PROMPT,
        IMAGE_PROMPT_USER_TEMPLATE.format(idea_json=to_prompt_json(idea)),
        LLMImagePromptOutput,
    )
    prompt = " ".join(result.prompt.split())

    try:
        data, content_type = await images.generate(prompt)
    except ImageGenerationError as e:
        if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Brak środków na koncie Pollinations dla modelu {images.model}. "
                "Doładuj konto albo ustaw darmowy model w POLLINATIONS_IMAGE_MODEL.",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nie udało się wygenerować obrazu. Spróbuj ponownie za chwilę.",
        )

    return GenerateImageResponse(image=to_data_url(data, content_type), prompt=prompt, model=images.model)
