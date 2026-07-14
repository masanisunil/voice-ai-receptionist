# Data Sources

## Clinic

Seed clinic: NU Hospitals.

Public sources:

- NU Hospitals website: https://www.nuhospitals.com/
- NU Hospitals overview: https://en.wikipedia.org/wiki/NU_Hospitals

## How Data Is Used

- Branches: Padmanabhanagar and Rajajinagar are seeded as two branches for cross-branch routing.
- Specialties: Urology, Pediatric Urology, and Nephrology are seeded for scenario coverage.
- Doctors: publicly listed NU-related doctors are seeded where available. One demo nephrology doctor is explicitly marked in metadata as replaceable by Cliniko import because branch-specific specialty routing requires a doctor record for test coverage.
- Availability: slot windows are synthetic operational data because public sites do not expose live PMS slot inventory.

## Production Replacement

In production, `prisma/seed.ts` should be replaced by a Cliniko import job:

1. Import practitioners.
2. Import business locations.
3. Import appointment types and durations.
4. Import practitioner availability.
5. Persist source IDs in `metadata` and `externalPmsId`.

