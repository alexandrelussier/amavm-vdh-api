package observation

import (
	"github.com/kamva/mgm/v3"
)

type AssetContentType string

const (
	ImageJpeg AssetContentType = "image/jpeg"
	ImagePng  AssetContentType = "image/png"
)

type ObservationRequestAsset struct {
	ContentType AssetContentType `json:"contentType" bson:"contentType"`
	Data        []byte           `json:"data" bson:"data"`
}

type ObservationRequest struct {
	Assets     []ObservationRequestAsset `json:"assets" bson:"assets"`
	Attributes []string                  `json:"attributes" bson:"attributes"`
	Comment    string                    `json:"comment" bson:"comment"`
	DeviceId   string                    `json:"deviceId" bson:"deviceId"`
	Position   [2]float64                `json:"position" bson:"position"`
	Timestamp  int64                     `json:"timestamp" bson:"timestamp"`
}

type ObservationStatus string

const (
	Pending  ObservationStatus = "pending"
	Rejected ObservationStatus = "rejected"
	Valid    ObservationStatus = "valid"
)

type ReportedObservation struct {
	mgm.DefaultModel `bson:",inline"`

	Status      ObservationStatus `json:"status" bson:"status"`
	Observation ObservationRequest
}
