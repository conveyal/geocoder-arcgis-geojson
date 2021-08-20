// @flow

import * as nock from 'nock'

// Jest can not compile typescript that is not a test file, so must be imported as js
import { autocomplete, bulk, reverse, search } from '../dist/index'

const mockBulkResult = require('./mock-bulk-result.json')
const mockBulkResultWithBadAddress = require('./mock-bulk-result-with-bad-address.json')
const mockReverseResult = require('./mock-reverse-result.json')
const mockSearchResult = require('./mock-search-result.json')
const mockSuggestResult = require('./mock-suggest-result.json')

const ARCGIS_GEOCODE_URL = 'https://geocode.arcgis.com/'
const BULK_URL =
  /arcgis\/rest\/services\/World\/GeocodeServer\/geocodeAddresses/
const REVERSE_URL =
  /arcgis\/rest\/services\/World\/GeocodeServer\/reverseGeocode/
const SEARCH_URL =
  /arcgis\/rest\/services\/World\/GeocodeServer\/findAddressCandidates/
const SUGGEST_URL = /arcgis\/rest\/services\/World\/GeocodeServer\/suggest/

function nockArcGet(url: RegExp) {
  return nock(ARCGIS_GEOCODE_URL).get(url)
}

function nockArcPost(url: RegExp) {
  return nock(ARCGIS_GEOCODE_URL).post(url)
}

function snapshotUri(type: string, response) {
  return (uri, requestBody) => {
    expect(uri).toMatchSnapshot(`basic ${type} request uri`)
    return response
  }
}

describe('geocoder-arcgis-geojson', () => {
  describe('autocomplete', () => {
    it('should make basic autocomplete query', async () => {
      nockArcGet(SUGGEST_URL).reply(
        200,
        snapshotUri('autocomplete', mockSuggestResult)
      )

      const result = await autocomplete({
        text: '123 main st'
      })
      expect(result).toMatchSnapshot('basic autocomplete g-a-g response')
    })
  })

  describe('bulk', () => {
    beforeEach(() => {
      // nock for auth token
      nock('https://www.arcgis.com/')
        .post(/sharing\/oauth2\/token/)
        .reply(200, { access_token: 'test', expires_in: 86400 })
    })

    it('should make basic bulk query', async () => {
      nockArcPost(BULK_URL).reply(200, mockBulkResult)

      const result = await bulk({
        addresses: ['123 main st'],
        clientId: 'test',
        clientSecret: 'test'
      })
      expect(result).toMatchSnapshot('basic bulk g-a-g response')
    })

    it('should handle bulk query resulting in no address found', async () => {
      nockArcPost(BULK_URL).reply(200, mockBulkResultWithBadAddress)

      const result = await bulk({
        addresses: ['aefgjil'],
        clientId: 'test',
        clientSecret: 'test'
      })
      expect(result).toMatchSnapshot(
        'bulk g-a-g response with no address found'
      )
    })
  })

  describe('reverse', () => {
    it('should make basic reverse query', async () => {
      nockArcGet(REVERSE_URL).reply(
        200,
        snapshotUri('reverse', mockReverseResult)
      )

      const result = await reverse({
        point: {
          lat: 37.06146,
          lon: -122.006443
        }
      })
      expect(result).toMatchSnapshot('basic reverse g-a-g response')
    })
  })

  describe('search', () => {
    it('should make basic search query', async () => {
      nockArcGet(SEARCH_URL).reply(200, snapshotUri('search', mockSearchResult))

      const result = await search({
        text: '123 main st'
      })
      expect(result).toMatchSnapshot('basic search g-a-g response')
    })
  })
})
