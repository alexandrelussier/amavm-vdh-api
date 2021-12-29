package main

import (
	"amavm-vdh-api/observation"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	"github.com/kamva/mgm/v3"
	"github.com/labstack/echo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func init() {
	_ = mgm.SetDefaultConfig(nil, "check_echo", options.Client().ApplyURI("mongodb://root:pass12345@mongodb:27017"))
}

func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Welcome to the HomePage")
	fmt.Println("Endpoint Hit: homePage")
}
func handleRequests() {
	myRouter := mux.NewRouter().StrictSlash(true)
	myRouter.HandleFunc("/", homePage)
	myRouter.HandleFunc("/api/v1/observations", returnAllObservations)
	myRouter.HandleFunc("/api/v1/observations", createNewObservation).Methods("POST")
	myRouter.HandleFunc("/api/v1/observations/{observationId}", deleteObservation).Methods("DELETE")
	myRouter.HandleFunc("/api/v1/observations/{observationId}/status", updateObservationStatus).Methods("PUT")
	myRouter.HandleFunc("/api/v1/observations/{observationId}", returnSingleObservation)
	myRouter.HandleFunc("/api/v1/bicycle-paths", returnBicyclePaths).Queries("bbox", "{bbox}")
	myRouter.HandleFunc("/api/v1/all-bicycle-paths", returnAllBicyclePaths)
	log.Fatal(http.ListenAndServe(":10000", myRouter))
}
func main() {
	resp, err := http.Get("https://data.montreal.ca/dataset/5ea29f40-1b5b-4f34-85b3-7c67088ff536/resource/0dc6612a-be66-406b-b2d9-59c9e1c65ebf/download/reseau_cyclable.geojson")
	if err != nil {
		log.Fatalln(err)
	}

	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}
	fmt.Println("Rest API v2.0 - Mux Routers")
	json.Unmarshal(body, &BicylePaths)

	Observations = []observation.ReportedObservation{
		{Id: uuid.New().String(), Status: Pending, Observation: ObservationRequest{Assets: []ObservationRequestAsset{}, Attributes: []string{}, Comment: "Glacé", DeviceId: "1234", Position: [2]float64{-73.574016326549469, 45.477907196722754}, Timestamp: 1611369326}},
		{Id: uuid.New().String(), Status: Valid, Observation: ObservationRequest{Assets: []ObservationRequestAsset{}, Attributes: []string{}, Comment: "enneigé", DeviceId: "5678", Position: [2]float64{-73.571998122403542, 45.468913352216369}, Timestamp: 1611365326}},
	}
	handleRequests()
}

type GeoJsonFeature struct {
	Geometry struct {
		Coordinates [][][]float64 `json:"coordinates"`
		Type        string        `json:"type"`
	} `json:"geometry"`
	Properties struct {
		ID2020     int64  `json:"ID2020"`
		IDTrcGeo   int64  `json:"ID_TRC_GEO"`
		Longueur   int64  `json:"LONGUEUR"`
		NbrVoie    int64  `json:"NBR_VOIE"`
		NomArrVi   string `json:"NOM_ARR_VI"`
		PROTEGE4S  string `json:"PROTEGE_4S"`
		SAISONS4   string `json:"SAISONS4"`
		Separateur string `json:"SEPARATEUR"`
		TypeVoie   int64  `json:"TYPE_VOIE"`
		TYPEVOIE2  int64  `json:"TYPE_VOIE2"`
		VilleMTL   string `json:"Ville_MTL"`
	} `json:"properties"`
	Type string `json:"type"`
}
type GeoJson struct {
	Type string `json:"type"`
	Name string `json:"name"`
	Crs  struct {
		Type     string `json:"type"`
		Property struct {
			Name string `json:"name"`
		} `json:"properties"`
	} `json:"crs"`
	Features []GeoJsonFeature `json:"features"`
}

var BicylePaths GeoJson
var Observations []observation.ReportedObservation

func returnAllObservations(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Endpoint Hit: returnAllObservations")
	json.NewEncoder(w).Encode(Observations)
}
func returnSingleObservation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["observationId"]
	for _, observation := range Observations {
		if observation.Id == key {
			json.NewEncoder(w).Encode(observation)
		}
	}
}

type M map[string]interface{}

// Define our errors:
var internalError = M{"message": "internal error"}
var bookNotFound = M{"message": "book not found"}

func createNewObservation(c echo.Context) {
	reqData := &observation.ObservationRequest{}
	_ = c.Bind(reqData)

	obsrv := &observation.ReportedObservation{
		Status:      observation.Pending,
		Observation: *reqData,
	}

	err := mgm.Coll(obsrv).Save(obsrv)

	if err != nil {
		return c.JSON(http.StatusBadRequest, internalError)
	}

	return c.JSON(http.StatusOK, obsrv)
}
func deleteObservation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["observationId"]
	for index, observation := range Observations {
		if observation.Id == id {
			Observations = append(Observations[:index], Observations[index+1:]...)
		}
	}
}

func updateObservationStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["observationId"]
	for index, observation := range Observations {
		if observation.Id == id {

			Observations = append(Observations[:index], Observations[index+1:]...)
		}
	}
}

type BboxQuery struct {
	bbox [4]float64
}

func returnBicyclePaths(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	w.WriteHeader(http.StatusOK)

	var bbox BboxQuery
	json.Unmarshal([]byte(vars["bbox"]), &bbox.bbox)

	fmt.Fprintf(w, "bbox: %v\n", bbox)
	for _, bpath := range BicylePaths.Features {
		json.NewEncoder(w).Encode(bpath)
	}

}

func returnAllBicyclePaths(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)

	for _, bpath := range BicylePaths.Features {
		fmt.Fprintf(w, "bpath: %+v\n", bpath)
	}

}
