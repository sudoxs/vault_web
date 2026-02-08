#!/bin/bash

OUTPUT="project_dump.txt"

# پاک کردن فایل قبلی اگر وجود داشت
> "$OUTPUT"

echo "===== PROJECT DUMP =====" >> "$OUTPUT"
echo "Generated at: $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# پیدا کردن فایل‌ها (به‌جز _site)
find . \
  -type f \
  ! -path "./_site/*" \
  ! -name "$OUTPUT" \
  | sort \
  | while read -r file; do

    echo "" >> "$OUTPUT"
    echo "==================================================" >> "$OUTPUT"
    echo "FILE: $file" >> "$OUTPUT"
    echo "==================================================" >> "$OUTPUT"
    echo "" >> "$OUTPUT"

    # اگر فایل باینری نبود، محتواشو بریز
    if file "$file" | grep -q text; then
        cat "$file" >> "$OUTPUT"
    else
        echo "[BINARY FILE - SKIPPED]" >> "$OUTPUT"
    fi
done

echo "" >> "$OUTPUT"
echo "===== END OF PROJECT =====" >> "$OUTPUT"
