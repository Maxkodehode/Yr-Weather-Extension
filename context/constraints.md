# Constraints

## Boundaries
- Only change what's needed: humidity -> dew point
- Do NOT refactor or "improve" anything else
- Do NOT change the layout, styling, or other data fields
- Match existing code style exactly

## API Notes
- The MET Norway locationforecast/2.0/compact API returns `dew_point_temperature` 
  in `properties.timeseries[].data.instant.details` as a number (degrees Celsius)
- Keep existing API calls unchanged — the data is already there

## GitHub
- Push to remote: `https://github.com/Maxkodehode/Yr-Weather-Extension.git`
- Commit format: `type(scope): description`
- Git identity: user.name="Maxkodehode", user.email="maxkodehode@gmail.com"
