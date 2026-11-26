# Validates a country file: jq -e -f /app/country-check.jq output/countries/country-NN.json
# prints true only when the file has the exact structure read by store.py and the blog. A file with
# `skipped` (written by run.sh, for a country not researched in this edition) is valid as it is.
def text: type == "string" and length > 0;
def optional_text: . == null or type == "string";

(.country | text)
and if has("skipped") then (.skipped | text) else
  (.trends | type == "array" and length >= 25)
  and ([.trends[].niche] | unique == [range(1; 26)])
  and all(.trends[]; (.subniche | text) and (.trend | text) and (.stage | optional_text)
          and (.platforms | optional_text) and (.evidence | optional_text)
          and (.source_url | optional_text) and (.source_date | optional_text))
  and (.content_formats | type == "array" and length >= 1)
  and all(.content_formats[]; (.format | text) and (.source_url | optional_text))
  and (.opportunities | type == "array" and length >= 1)
  and all(.opportunities[]; (.opportunity | text) and (.niche | type == "number")
          and (.source_url | optional_text))
end
