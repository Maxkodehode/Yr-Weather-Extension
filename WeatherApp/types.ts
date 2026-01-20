export interface Welcome {
    type:       string;
    geometry:   Geometry;
    properties: Properties;
}

export interface Geometry {
    type:        string;
    coordinates: number[];
}

export interface Properties {
    meta:       Meta;
    timeseries: Timesery[];
}

export interface Meta {
    updated_at: Date;
    units:      Units;
}

export interface Units {
    air_pressure_at_sea_level: string;
    air_temperature:           string;
    cloud_area_fraction:       string;
    precipitation_amount:      string;
    relative_humidity:         string;
    wind_from_direction:       string;
    wind_speed:                string;
}

export interface Timesery {
    time: Date;
    data: Data;
}

export interface Data {
    instant:        Instant;
    next_12_hours?: Next12_Hours;
    next_1_hours?:  NextHours;
    next_6_hours?:  NextHours;
}

export interface Instant {
    details: InstantDetails;
}

export interface InstantDetails {
    air_pressure_at_sea_level: number;
    air_temperature:           number;
    cloud_area_fraction:       number;
    relative_humidity:         number;
    wind_from_direction:       number;
    wind_speed:                number;
}

export interface Next12_Hours {
    summary: Summary;
    details: Next12_HoursDetails;
}

export interface Next12_HoursDetails {
}

export interface Summary {
    symbol_code: SymbolCode;
}

export enum SymbolCode {
    ClearskyDay = "clearsky_day",
    ClearskyNight = "clearsky_night",
    Cloudy = "cloudy",
    FairDay = "fair_day",
    FairNight = "fair_night",
    PartlycloudyDay = "partlycloudy_day",
    PartlycloudyNight = "partlycloudy_night",
}

export const weatherSymbolKeys = {
    clearsky_day: '01d',
    clearsky_night: '01n',
    clearsky_polartwilight: '01m',
    fair_day: '02d',
    fair_night: '02n',
    fair_polartwilight: '02m',
    partlycloudy_day: '03d',
    partlycloudy_night: '03n',
    partlycloudy_polartwilight: '03m',
    cloudy: '04',
    rainshowers_day: '05d',
    rainshowers_night: '05n',
    rainshowers_polartwilight: '05m',
    rainshowersandthunder_day: '06d',
    rainshowersandthunder_night: '06n',
    rainshowersandthunder_polartwilight: '06m',
    sleetshowers_day: '07d',
    sleetshowers_night: '07n',
    sleetshowers_polartwilight: '07m',
    snowshowers_day: '08d',
    snowshowers_night: '08n',
    snowshowers_polartwilight: '08m',
    rain: '09',
    heavyrain: '10',
    heavyrainandthunder: '11',
    sleet: '12',
    snow: '13',
    snowandthunder: '14',
    fog: '15',
    sleetshowersandthunder_day: '20d',
    sleetshowersandthunder_night: '20n',
    sleetshowersandthunder_polartwilight: '20m',
    snowshowersandthunder_day: '21d',
    snowshowersandthunder_night: '21n',
    snowshowersandthunder_polartwilight: '21m',
    rainandthunder: '22',
    sleetandthunder: '23',
    lightrainshowersandthunder_day: '24d',
    lightrainshowersandthunder_night: '24n',
    lightrainshowersandthunder_polartwilight: '24m',
    heavyrainshowersandthunder_day: '25d',
    heavyrainshowersandthunder_night: '25n',
    heavyrainshowersandthunder_polartwilight: '25m',
    lightssleetshowersandthunder_day: '26d',
    lightssleetshowersandthunder_night: '26n',
    lightssleetshowersandthunder_polartwilight: '26m',
    heavysleetshowersandthunder_day: '27d',
    heavysleetshowersandthunder_night: '27n',
    heavysleetshowersandthunder_polartwilight: '27m',
    lightssnowshowersandthunder_day: '28d',
    lightssnowshowersandthunder_night: '28n',
    lightssnowshowersandthunder_polartwilight: '28m',
    heavysnowshowersandthunder_day: '29d',
    heavysnowshowersandthunder_night: '29n',
    heavysnowshowersandthunder_polartwilight: '29m',
    lightrainandthunder: '30',
    lightsleetandthunder: '31',
    heavysleetandthunder: '32',
    lightsnowandthunder: '33',
    heavysnowandthunder: '34',
    lightrainshowers_day: '40d',
    lightrainshowers_night: '40n',
    lightrainshowers_polartwilight: '40m',
    heavyrainshowers_day: '41d',
    heavyrainshowers_night: '41n',
    heavyrainshowers_polartwilight: '41m',
    lightsleetshowers_day: '42d',
    lightsleetshowers_night: '42n',
    lightsleetshowers_polartwilight: '42m',
    heavysleetshowers_day: '43d',
    heavysleetshowers_night: '43n',
    heavysleetshowers_polartwilight: '43m',
    lightsnowshowers_day: '44d',
    lightsnowshowers_night: '44n',
    lightsnowshowers_polartwilight: '44m',
    heavysnowshowers_day: '45d',
    heavysnowshowers_night: '45n',
    heavysnowshowers_polartwilight: '45m',
    lightrain: '46',
    lightsleet: '47',
    heavysleet: '48',
    lightsnow: '49',
    heavysnow: '50',
} as const;

export interface NextHours {
    summary: Summary;
    details: Next1_HoursDetails;
}

export interface Next1_HoursDetails {
    precipitation_amount: number;
}
