import {
  NextRequest,
  NextResponse
} from "next/server";


/* =========================================================
   PLACE TYPE
   ========================================================= */

type Place = {
  title: string;
  description: string;
  image: string | null;
  lat: number;
  lon: number;
  source: string;
  mapsUrl: string;
  category: string;
};


/* =========================================================
   APP IDENTIFICATION
   ========================================================= */

const USER_AGENT =
  "TripPilot/1.0 (free attraction discovery)";


/* =========================================================
   CREATE GOOGLE MAPS LINK
   ========================================================= */

function createMapsUrl(
  title: string,
  lat: number,
  lon: number
) {
  const query = encodeURIComponent(
    `${title} @${lat},${lon}`
  );

  return (
    "https://www.google.com/maps/search/" +
    `?api=1&query=${query}`
  );
}


/* =========================================================
   IDENTIFY ATTRACTION CATEGORY
   ========================================================= */

function getOsmCategory(
  tags: Record<string, string>
) {
  const category =
    tags.tourism ||
    tags.historic ||
    tags.leisure ||
    tags.amenity ||
    tags.natural ||
    "attraction";

  return category
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );
}


/* =========================================================
   CREATE ATTRACTION DESCRIPTION
   ========================================================= */

function createDescription(
  title: string,
  category: string,
  location: string
) {
  return (
    `${title} is a mapped ` +
    `${category.toLowerCase()} near ${location}. ` +
    "Open it in Google Maps to check directions, " +
    "visitor information and reviews."
  );
}


/* =========================================================
   SEARCH NEARBY ATTRACTIONS
   ========================================================= */

export async function GET(
  request: NextRequest
) {
  const location = request.nextUrl.searchParams
    .get("location")
    ?.trim();

  if (!location) {
    return NextResponse.json(
      {
        error: "Location is required"
      },
      {
        status: 400
      }
    );
  }

  try {
    /* =====================================================
       FIND THE DESTINATION COORDINATES
       ===================================================== */

    const geocodingParameters =
      new URLSearchParams({
        q: location,
        format: "json",
        limit: "1",
        addressdetails: "1"
      });

    const geocodingResponse = await fetch(
      "https://nominatim.openstreetmap.org/search?" +
        geocodingParameters.toString(),

      {
        headers: {
          "User-Agent": USER_AGENT
        },

        next: {
          revalidate: 86400
        }
      }
    );

    if (!geocodingResponse.ok) {
      throw new Error(
        "Location lookup failed"
      );
    }

    const matchingLocations =
      await geocodingResponse.json();

    if (
      !Array.isArray(matchingLocations) ||
      matchingLocations.length === 0
    ) {
      return NextResponse.json({
        places: [],

        message:
          `We could not verify ${location} ` +
          "on the map."
      });
    }

    const matchedLocation =
      matchingLocations[0];

    const latitude = Number(
      matchedLocation.lat
    );

    const longitude = Number(
      matchedLocation.lon
    );


    /* =====================================================
       BUILD OPENSTREETMAP ATTRACTION QUERY
       ===================================================== */

    const searchRadius = 15000;

    const nearbyLocation =
      `around:${searchRadius},` +
      `${latitude},${longitude}`;

    const overpassQuery = `
      [out:json][timeout:20];

      (
        nwr(${nearbyLocation})
          [tourism~"attraction|museum|viewpoint|gallery|zoo|theme_park"];

        nwr(${nearbyLocation})
          [historic~"castle|fort|monument|memorial|archaeological_site|ruins"];

        nwr(${nearbyLocation})
          [amenity="place_of_worship"]
          [name];

        nwr(${nearbyLocation})
          [leisure~"park|nature_reserve"];

        nwr(${nearbyLocation})
          [natural~"beach|waterfall|peak|cave_entrance"];
      );

      out center tags 45;
    `;


    /* =====================================================
       BUILD WIKIPEDIA QUERY
       ===================================================== */

    const wikipediaParameters =
      new URLSearchParams({
        action: "query",

        generator: "geosearch",

        ggsprimary: "all",

        ggsnamespace: "0",

        ggsradius: "10000",

        ggslimit: "24",

        ggscoord:
          `${latitude}|${longitude}`,

        prop:
          "coordinates|pageimages|extracts",

        piprop: "thumbnail",

        pithumbsize: "900",

        exintro: "1",

        explaintext: "1",

        exsentences: "2",

        format: "json",

        origin: "*"
      });


    /* =====================================================
       FETCH OPENSTREETMAP AND WIKIPEDIA DATA
       ===================================================== */

    const [
      overpassResponse,
      wikipediaResponse
    ] = await Promise.all([
      fetch(
        "https://overpass-api.de/api/interpreter",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",

            "User-Agent": USER_AGENT
          },

          body: new URLSearchParams({
            data: overpassQuery
          }),

          next: {
            revalidate: 86400
          }
        }
      ),

      fetch(
        "https://en.wikipedia.org/w/api.php?" +
          wikipediaParameters.toString(),

        {
          next: {
            revalidate: 86400
          }
        }
      )
    ]);

    const overpassData =
      overpassResponse.ok

        ? await overpassResponse.json()

        : {
            elements: []
          };

    const wikipediaData =
      wikipediaResponse.ok

        ? await wikipediaResponse.json()

        : {};


    /* =====================================================
       EXCLUDE IRRELEVANT SEARCH RESULTS
       ===================================================== */

    const blockedTerms =
      /station|railway|junction|village|district|constituency|municipal council|highway|politician|actor|film|album/i;


    /* =====================================================
       FORMAT WIKIPEDIA ATTRACTIONS
       ===================================================== */

    const wikipediaPages = Object.values(
      wikipediaData?.query?.pages || {}
    );

    const wikipediaPlaces: Place[] =
      wikipediaPages

        .map((page: any) => {
          const placeLatitude = Number(
            page.coordinates?.[0]?.lat
          );

          const placeLongitude = Number(
            page.coordinates?.[0]?.lon
          );

          return {
            title: page.title,

            description:
              page.extract ||
              "Verified nearby place from Wikipedia.",

            image:
              page.thumbnail?.source ||
              null,

            lat: placeLatitude,

            lon: placeLongitude,

            source:
              "https://en.wikipedia.org/" +
              `?curid=${page.pageid}`,

            mapsUrl: createMapsUrl(
              page.title,
              placeLatitude,
              placeLongitude
            ),

            category:
              "Wikipedia Landmark"
          };
        })

        .filter((place: Place) => {
          return (
            Number.isFinite(place.lat) &&
            Number.isFinite(place.lon) &&
            place.description.length > 70 &&
            !blockedTerms.test(place.title)
          );
        });


    /* =====================================================
       FORMAT OPENSTREETMAP ATTRACTIONS
       ===================================================== */

    const openStreetMapPlaces: Place[] =
      (overpassData.elements || [])

        .map((item: any) => {
          const tags =
            item.tags || {};

          const title =
            tags["name:en"] ||
            tags.name;

          const placeLatitude = Number(
            item.lat ??
              item.center?.lat
          );

          const placeLongitude = Number(
            item.lon ??
              item.center?.lon
          );

          if (!title) {
            return null;
          }

          if (
            !Number.isFinite(
              placeLatitude
            )
          ) {
            return null;
          }

          if (
            !Number.isFinite(
              placeLongitude
            )
          ) {
            return null;
          }

          if (
            blockedTerms.test(title)
          ) {
            return null;
          }

          const category =
            getOsmCategory(tags);

          return {
            title,

            description:
              createDescription(
                title,
                category,
                location
              ),

            image:
              tags.image ||
              null,

            lat:
              placeLatitude,

            lon:
              placeLongitude,

            source:
              "https://www.openstreetmap.org/" +
              `${item.type}/${item.id}`,

            mapsUrl:
              createMapsUrl(
                title,
                placeLatitude,
                placeLongitude
              ),

            category
          };
        })

        .filter(Boolean) as Place[];


    /* =====================================================
       REMOVE DUPLICATE ATTRACTIONS
       ===================================================== */

    const seenPlaces =
      new Set<string>();

    const allPlaces = [
      ...wikipediaPlaces,

      ...openStreetMapPlaces
    ];

    const uniquePlaces =
      allPlaces.filter((place) => {
        const normalizedTitle =
          place.title

            .toLowerCase()

            .replace(
              /[^a-z0-9]/g,
              ""
            );

        if (!normalizedTitle) {
          return false;
        }

        if (
          seenPlaces.has(
            normalizedTitle
          )
        ) {
          return false;
        }

        seenPlaces.add(
          normalizedTitle
        );

        return true;
      });


    /* =====================================================
       PRIORITIZE ATTRACTIONS WITH IMAGES
       ===================================================== */

    const places = uniquePlaces

      .sort(
        (first, second) => {
          return (
            Number(
              Boolean(second.image)
            ) -

            Number(
              Boolean(first.image)
            )
          );
        }
      )

      .slice(0, 12);


    /* =====================================================
       RETURN RESULTS
       ===================================================== */

    return NextResponse.json({
      location:
        matchedLocation.display_name,

      coordinates: {
        lat: latitude,

        lon: longitude
      },

      places,

      providers: [
        "OpenStreetMap",

        "Wikipedia",

        "Wikimedia Commons"
      ]
    });
  } catch (error) {
    console.error(
      "Free attraction search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Verified place search is temporarily unavailable."
      },

      {
        status: 502
      }
    );
  }
}