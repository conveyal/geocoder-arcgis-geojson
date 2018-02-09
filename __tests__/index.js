// @flow

import nock from 'nock'

import {autocomplete, bulk, reverse, search} from '../index'

const mockBulkResult = require('./mock-bulk-result.json')
const mockBulkResultWithBadAddress = require('./mock-bulk-result-with-bad-address.json')
const mockReverseResult = require('./mock-reverse-result.json')
const mockSearchResult = require('./mock-search-result.json')
const mockSuggestResult = require('./mock-suggest-result.json')

function prepareNock (
  type: 'autocomplete' | 'bulk' | 'search' | 'reverse',
  snapshotUri = true,
  response?: Object
) {
  if (type === 'bulk') {
    // nock for auth token
    nock('https://www.arcgis.com/')
      .post(/sharing\/oauth2\/token/)
      .reply(200, { access_token: 'test', expires_in: 86400 })
  }

  let n = nock('https://geocode.arcgis.com/')

  switch (type) {
    case 'autocomplete':
      n = n.get(/arcgis\/rest\/services\/World\/GeocodeServer\/suggest/)
      response = response || mockSuggestResult
      break
    case 'bulk':
      n = n.post(/arcgis\/rest\/services\/World\/GeocodeServer\/geocodeAddresses/)
      response = response || mockBulkResult
      break
    case 'reverse':
      n = n.get(/arcgis\/rest\/services\/World\/GeocodeServer\/reverseGeocode/)
      response = response || mockReverseResult
      break
    case 'search':
      n = n.get(/arcgis\/rest\/services\/World\/GeocodeServer\/findAddressCandidates/)
      response = response || mockSearchResult
      break
    default:
      throw new Error('invalid type')
  }

  n.reply(200, (uri, requestBody) => {
    if (snapshotUri) {
      expect(uri).toMatchSnapshot(`basic ${type} request uri`)
    }

    return response
  })
}

describe('geocoder-arcgis-geojson', () => {
  describe('autocomplete', () => {
    it('should make basic autocomplete query', async () => {
      prepareNock('autocomplete')

      const result = await autocomplete({
        text: '123 main st'
      })
      expect(result).toMatchSnapshot('basic autocomplete g-a-g response')
    })
  })

  describe('bulk', () => {
    it('should make basic bulk query', async () => {
      prepareNock('bulk', false)

      const result = await bulk({
        addresses: ['123 main st'],
        clientId: 'test',
        clientSecret: 'test'
      })
      expect(result).toMatchSnapshot('basic bulk g-a-g response')
    })

    it('should handle bulk query resulting in no address found', async () => {
      prepareNock('bulk', false, mockBulkResultWithBadAddress)

      const result = await bulk({
        addresses: ['aefgjil'],
        clientId: 'test',
        clientSecret: 'test'
      })
      expect(result).toMatchSnapshot('bulk g-a-g response with no address found')
    })
  })

  describe('reverse', () => {
    it('should make basic reverse query', async () => {
      prepareNock('reverse')

      const result = await reverse({
        point: {
          lat: 37.061460,
          lon: -122.006443
        }
      })
      expect(result).toMatchSnapshot('basic reverse g-a-g response')
    })
  })

  describe('search', () => {
    it('should make basic search query', async () => {
      prepareNock('search')

      const result = await search({
        text: '123 main st'
      })
      expect(result).toMatchSnapshot('basic search g-a-g response')
    })
  })
})
