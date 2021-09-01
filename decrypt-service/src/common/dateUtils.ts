import * as moment from 'moment'

export const getDateFromStr = (str: string) => {
  return moment(str, 'DD-MM-YYYY hh:mm:ss').utc(true).toDate()
}

export const getIsoStringFromStr = (str: string) => {
  return moment(str, 'DD-MM-YYYY hh:mm:ss').utc(true).toISOString()
}
