def comma_separated_to_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]
