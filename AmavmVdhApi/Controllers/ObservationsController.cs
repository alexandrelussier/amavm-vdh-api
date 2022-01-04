using AmavmVdhApi.Models;
using AmavmVdhApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AmavmVdhApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ObservationsController : ControllerBase
{
    private readonly ObservationsService _observationsService;

    public ObservationsController(ObservationsService observationsService) =>
        _observationsService = observationsService;

    [HttpGet]
    public async Task<List<ReportedObservation>> Get() =>
        await _observationsService.GetAsync();

    [HttpGet("{id:length(24)}")]
    public async Task<ActionResult<ReportedObservation>> Get(string id)
    {
        var book = await _observationsService.GetAsync(id);

        if (book is null)
        {
            return NotFound();
        }

        return book;
    }

    [HttpPost]
    public async Task<IActionResult> Post(ObservationRequest newBook)
    {
        ReportedObservation obsrv = new ReportedObservation
        {
            Status = ObservationStatus.Pending,
            Observation = newBook,
        };
        await _observationsService.CreateAsync(obsrv);

        return CreatedAtAction(nameof(Get), new { id = obsrv.Id }, newBook);
    }

    [HttpPut("{id:length(24)}/status")]
    public async Task<IActionResult> Update(string id, ObservationStatus updatedStatus)
    {
        var book = await _observationsService.GetAsync(id);

        if (book is null)
        {
            return NotFound();
        }

        book.Status = updatedStatus;

        await _observationsService.UpdateAsync(id, book);

        return NoContent();
    }

    [HttpDelete("{id:length(24)}")]
    public async Task<IActionResult> Delete(string id)
    {
        var book = await _observationsService.GetAsync(id);

        if (book is null)
        {
            return NotFound();
        }

        await _observationsService.RemoveAsync(book.Id);

        return NoContent();
    }
}