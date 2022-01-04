using AmavmVdhApi.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace AmavmVdhApi.Services;

public class ObservationsService
{
    private readonly IMongoCollection<ReportedObservation> _observationsCollection;

    public ObservationsService(
        IOptions<ObservationStoreDatabaseSettings> observationStoreDatabaseSettings)
    {
        var clientSettings = MongoClientSettings.FromConnectionString(observationStoreDatabaseSettings.Value.ConnectionString);
        clientSettings.Credential = MongoCredential.CreateCredential("admin", observationStoreDatabaseSettings.Value.Username, observationStoreDatabaseSettings.Value.Password);

        var mongoClient = new MongoClient(clientSettings);

        var mongoDatabase = mongoClient.GetDatabase(
            observationStoreDatabaseSettings.Value.DatabaseName);

        _observationsCollection = mongoDatabase.GetCollection<ReportedObservation>(
            observationStoreDatabaseSettings.Value.ObservationCollectionName);
    }

    public async Task<List<ReportedObservation>> GetAsync() =>
        await _observationsCollection.Find(_ => true).ToListAsync();

    public async Task<ReportedObservation?> GetAsync(string id) =>
        await _observationsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(ReportedObservation newBook) =>
        await _observationsCollection.InsertOneAsync(newBook);

    public async Task UpdateAsync(string id, ReportedObservation updatedBook) =>
        await _observationsCollection.ReplaceOneAsync(x => x.Id == id, updatedBook);

    public async Task RemoveAsync(string id) =>
        await _observationsCollection.DeleteOneAsync(x => x.Id == id);
}