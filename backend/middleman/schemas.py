from typing import List, Literal, Optional

from pydantic import BaseModel, Field

InstitutionType = Literal[
    "gmina_miejska",
    "gmina_wiejska",
    "gmina_miejsko_wiejska",
    "powiat",
    "cus",
    "ops",
    "ngo",
    "inna",
]

INSTITUTION_TYPE_LABELS: dict[str, str] = {
    "gmina_miejska": "Gmina miejska",
    "gmina_wiejska": "Gmina wiejska",
    "gmina_miejsko_wiejska": "Gmina miejsko-wiejska",
    "powiat": "Powiat",
    "cus": "Centrum Usług Społecznych",
    "ops": "Ośrodek pomocy społecznej",
    "ngo": "Organizacja pozarządowa (NGO)",
    "inna": "Inna instytucja",
}

BudgetRange = Literal["below_20k", "20k_100k", "100k_500k", "above_500k"]

BUDGET_LABELS: dict[str, str] = {
    "below_20k": "poniżej 20 tys. zł",
    "20k_100k": "20–100 tys. zł",
    "100k_500k": "100–500 tys. zł",
    "above_500k": "powyżej 500 tys. zł",
}

BUDGET_UPPER_LIMITS_PLN: dict[str, Optional[int]] = {
    "below_20k": 20_000,
    "20k_100k": 100_000,
    "100k_500k": 500_000,
    "above_500k": None,
}

BUDGET_DISCLAIMER = (
    "Budżet jest szacunkiem przygotowanym przez asystenta AI na podstawie opisu innowacji "
    "i profilu instytucji. Przed wdrożeniem zweryfikuj kwoty z lokalnymi cenami i księgowością."
)


class InstitutionProfile(BaseModel):
    institution_type: InstitutionType = Field(..., description="Typ instytucji zgłaszającej się")
    institution_name: Optional[str] = Field(None, max_length=200, description="Nazwa instytucji lub gminy (opcjonalnie)")
    powiat: str = Field(..., min_length=2, max_length=100, description="Powiat w Małopolsce")
    target_group: str = Field(..., min_length=2, max_length=500, description="Grupa docelowa usługi")
    recipients_count: Optional[int] = Field(None, ge=1, le=1_000_000, description="Przybliżona liczba odbiorców")
    budget_range: BudgetRange = Field(..., description="Dostępny budżet (przedział)")
    staff_resources: str = Field(
        ..., min_length=2, max_length=500, description="Obecna kadra instytucji (wynagrodzenia nie wchodzą do budżetu usługi)"
    )
    time_horizon_months: Literal[3, 6, 12] = Field(..., description="Horyzont czasowy wdrożenia w miesiącach")
    local_context: Optional[str] = Field(None, max_length=2000, description="Lokalny problem / dodatkowe uwagi")


class Adaptation(BaseModel):
    change: str = Field(..., min_length=3, description="Co zmieniono względem oryginalnej innowacji")
    reason: str = Field(..., min_length=3, description="Dlaczego – z odniesieniem do profilu instytucji")


class ServiceResources(BaseModel):
    staff: List[str] = Field(default_factory=list)
    premises: List[str] = Field(default_factory=list)
    equipment: List[str] = Field(default_factory=list)
    local_partners: List[str] = Field(default_factory=list)


class TimelinePhase(BaseModel):
    name: str = Field(..., min_length=2)
    duration: str = Field(..., min_length=1, description="Np. 'miesiące 1–2'")
    activities: List[str] = Field(..., min_length=1)


class BudgetItem(BaseModel):
    name: str = Field(..., min_length=2)
    amount_pln: int = Field(..., ge=0)
    note: Optional[str] = None


class BudgetEstimate(BaseModel):
    items: List[BudgetItem] = Field(..., min_length=1)
    total_pln: int = Field(0, ge=0)
    disclaimer: str = BUDGET_DISCLAIMER


class FundingSource(BaseModel):
    source: str = Field(..., min_length=2)
    how_to_use: str = Field(..., min_length=2)


class Kpi(BaseModel):
    name: str = Field(..., min_length=2)
    target: str = Field(..., min_length=1)
    measurement: str = Field(..., min_length=2)


class Risk(BaseModel):
    risk: str = Field(..., min_length=2)
    mitigation: str = Field(..., min_length=2)


class ServiceCard(BaseModel):
    service_name: str = Field(..., min_length=3, max_length=200)
    summary: str = Field(..., min_length=10, description="2–3 zdania prostym językiem")
    adaptations: List[Adaptation] = Field(..., min_length=1)
    scope: List[str] = Field(..., min_length=1, description="Zakres usługi")
    recipients: str = Field(..., min_length=2, description="Odbiorcy usługi")
    resources: ServiceResources
    timeline: List[TimelinePhase] = Field(..., min_length=1)
    budget: BudgetEstimate
    feasibility_note: Optional[str] = Field(
        None, max_length=1000, description="Uczciwe ostrzeżenie, gdy usługi nie da się sensownie zmieścić w budżecie"
    )
    funding_sources: List[FundingSource] = Field(default_factory=list)
    kpis: List[Kpi] = Field(..., min_length=1)
    risks: List[Risk] = Field(..., min_length=1)
    next_steps: List[str] = Field(..., min_length=1)


class AdaptRequest(BaseModel):
    innovation_id: str = Field(..., min_length=1)
    profile: InstitutionProfile


class RefineRequest(BaseModel):
    innovation_id: str = Field(..., min_length=1)
    profile: InstitutionProfile
    card: ServiceCard
    instruction: str = Field(..., min_length=2, max_length=2000, description="Prośba o poprawkę, np. 'mamy mniejszy budżet'")


class ServiceCardResponse(BaseModel):
    innovation_id: str
    innovation_title: str
    innovation_url: Optional[str] = None
    card: ServiceCard
