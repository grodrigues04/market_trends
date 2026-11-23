# Validates output/highlights.json: jq -e -f /app/highlights-check.jq output/highlights.json
# prints true only when the file has the exact structure read by the blog and by youtube_dark.
(.title | type == "string" and length > 0)
and (.summary | type == "string" and length > 0)
and ([.recommendations[]?.key] == ["most_promising", "overlooked_micro_niches", "growth_6_12_months",
                                   "best_balance", "faceless_content", "saas_ai", "adapt_to_brazil"])
and all(.recommendations[]; (.title | type == "string") and (.items | length) == 10
        and all(.items[]; (.name | type == "string") and (.description | type == "string")))
and (.top_opportunities | type == "array" and length == 50)
and all(.top_opportunities[]; (.rank | type == "number") and (.opportunity | type == "string"))
