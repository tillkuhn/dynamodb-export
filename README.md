AWS_PROFILE=myprofile ./export.js
psql -U angkor -d angkor -f dump/yummy-place.sql
