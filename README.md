# geocoder-argis-geojson

Isomorphic geocoding for reuse across our JavaScript libraries. This library is built to match the API of [Isomorphic Mapzen Search](https://github.com/conveyal/isomorphic-mapzen-search/) in order to facilitate a quick conversion of our applications to use ESRI's geocoder.  Read the ESRI docs [here](https://developers.arcgis.com/labs/rest/get-an-access-token/). Coordinates must be anything that can be parsed by [lonlng](https://github.com/conveyal/lonlng).

-   [Examples](#examples)
-   [API Documentation](#api)

## Examples

### `Autocomplete`

```js
import {autocomplete} from 'isomorphic-mapzen-search'

autocomplete({
  apiKey: MAPZEN_API_KEY,
  boundary: {
    country: 'US',
    rect: {
      minLon: minLon,
      minLat: minLat,
      maxLon: maxLon,
      maxLat: maxLat
    }
  },
  focusPoint: {lat: 39.7691, lon: -86.1570},
  layers: 'venue,coarse',
  text: '1301 U Str'
}).then((result) => {
  console.log(result)
}).catch((err) => {
  console.error(err)
})
```

### `search({apiKey, text, ...options})`

```js
import {search} from 'isomorphic-mapzen-search'

search({
  apiKey: MAPZEN_API_KEY,
  text: '1301 U Street NW, Washington, DC',
  focusPoint: {lat: 39.7691, lon: -86.1570},
  boundary: {
    country: 'US',
    rect: {
      minLon: minLon,
      minLat: minLat,
      maxLon: maxLon,
      maxLat: maxLat
    },
    circle: {
      centerPoint: centerLonLat,
      radius: 35 // kilometers
    }
  },
  format: false // keep as returned GeoJSON
}).then((geojson) => {
  console.log(geojson)
}).catch((err) => {
  console.error(err)
})
```

### `reverse({apiKey, point, format})`

```js
import {reverse} from 'isomorphic-mapzen-search'

reverse({
  apiKey: MAPZEN_API_KEY,
  point: {
    lat: 39.7691,
    lng: -86.1570
  },
  format: true
}).then((json) => {
  console.log(json[0].address)
}).catch((err) => {
  console.error(err)
})
```
