# Validates output/highlights.json: jq -e -f /app/highlights-check.jq output/highlights.json
# prints true only when the file has the exact structure read by the blog and by youtube_dark.
def text: type == "string" and length > 0;
def texts($count): type == "array" and length == $count and all(.[]; text);
def between($minimum; $maximum): type == "array" and length >= $minimum and length <= $maximum;

(.title | text)
and (.comparison | between(3; 15))
and all(.comparison[]; (.trend | text) and (.countries | type == "array" and all(.[]; text))
        and (.pattern | text))
and (.top_opportunities | between(10; 50))
and all(.top_opportunities[]; (.rank | type == "number") and (.opportunity | text)
        and (.country | text) and (.niche | text) and (.score | type == "number"))
and (.content_opportunities | between(5; 20))
and all(.content_opportunities[]; (.rank | type == "number") and (.theme | text)
        and (.ideas | texts(5)) and (.hooks | texts(3)))
and (.business_opportunities | between(5; 20))
and all(.business_opportunities[]; (.rank | type == "number") and (.concept | text))
and ([.recommendations[]?.key] == ["most_promising", "overlooked_micro_niches", "growth_6_12_months",
                                   "best_balance", "faceless_content", "saas_ai", "adapt_to_brazil"])
and all(.recommendations[]; (.title | text) and (.items | between(5; 10))
        and all(.items[]; (.name | text) and (.description | text)))
